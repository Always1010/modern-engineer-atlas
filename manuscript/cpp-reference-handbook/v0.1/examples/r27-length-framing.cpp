#include <exception>
#include <climits>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

class Decoder {
    unsigned header_bytes_ = 0;
    unsigned length_ = 0;
    std::string payload_;
    static constexpr unsigned max_length_ = 8;
public:
    std::vector<std::string> feed(const std::vector<unsigned char>& bytes) {
        std::vector<std::string> completed;
        for (unsigned char byte : bytes) {
            if (header_bytes_ < 2) {
                length_ = (length_ << 8) | byte;
                ++header_bytes_;
                if (header_bytes_ == 2) {
                    if (length_ > max_length_)
                        throw std::runtime_error("frame too large");
                    if (length_ == 0) {
                        completed.emplace_back();
                        header_bytes_ = 0;
                        length_ = 0;
                    }
                }
            } else {
                payload_.push_back(static_cast<char>(byte));
                if (payload_.size() == length_) {
                    completed.push_back(payload_);
                    payload_.clear();
                    header_bytes_ = 0;
                    length_ = 0;
                }
            }
        }
        return completed;
    }
    void finish() const {
        if (header_bytes_ != 0 || !payload_.empty())
            throw std::runtime_error("truncated frame");
    }
};

int main() {
    static_assert(CHAR_BIT == 8, "this wire format needs 8-bit bytes");
    try {
        Decoder decoder;
        std::vector<std::string> messages;
        const std::vector<std::vector<unsigned char>> chunks{
            {0}, {2, 'A'}, {'B', 0, 3, 'x', 'y', 'z'}, {0, 0}
        };
        for (const auto& chunk : chunks) {
            for (const auto& message : decoder.feed(chunk))
                messages.push_back(message);
        }
        decoder.finish();
        if (messages != std::vector<std::string>{"AB", "xyz", ""}) return 1;
        bool oversized = false, truncated = false;
        try {
            Decoder bad;
            (void)bad.feed({0, 9});
        } catch (const std::runtime_error&) { oversized = true; }
        try {
            Decoder bad;
            (void)bad.feed({0, 3, 'z'});
            bad.finish();
        } catch (const std::runtime_error&) { truncated = true; }
        if (!oversized || !truncated) return 2;
        std::cout << "frames=3 oversize=checked EOF=checked\n";
    } catch (const std::exception& e) {
        std::cerr << e.what() << '\n';
        return 3;
    }
}
