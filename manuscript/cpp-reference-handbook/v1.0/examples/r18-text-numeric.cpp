#include <array>
#include <charconv>
#include <climits>
#include <cstdint>
#include <iostream>
#include <random>
#include <string_view>
#include <system_error>

bool parse(std::string_view s, int& value) {
    if (s.empty()) return false;
    int candidate = 0;
    auto r = std::from_chars(s.data(), s.data() + s.size(), candidate);
    if (r.ec != std::errc{} || r.ptr != s.data() + s.size()) return false;
    value = candidate;
    return true;
}

int main() {
    int value = 9;
    if (!parse("42", value) || value != 42) return 1;
    if (parse("42x", value) || value != 42) return 2;
    if (parse("999999999999999999999999", value)) return 3;
    std::array<char, 16> buffer{};
    auto r = std::to_chars(buffer.data(), buffer.data() + buffer.size(), value);
    if (r.ec != std::errc{} || std::string_view(buffer.data(), r.ptr - buffer.data()) != "42") return 4;
    std::mt19937 a(123), b(123);
    if (a() != b()) return 5;
    static_assert(CHAR_BIT == 8, "This wire example requires 8-bit bytes");
    const unsigned char wire[]{0x12, 0x34};
    auto field = (std::uint32_t{wire[0]} << 8) | wire[1];
    if (field != 0x1234) return 6;
    std::cout << "parse=42 suffix=rejected overflow=rejected wire=4660\n";
}
