#include <array>
#include <climits>
#include <cstdint>
#include <iostream>

int main() {
    static_assert(CHAR_BIT == 8, "this wire format needs 8-bit bytes");
    const std::uint32_t value = 0x01020304u;
    std::array<unsigned char, 4> bytes{{
        static_cast<unsigned char>(value >> 24),
        static_cast<unsigned char>(value >> 16),
        static_cast<unsigned char>(value >> 8),
        static_cast<unsigned char>(value)
    }};
    std::uint32_t decoded = 0;
    for (unsigned char byte : bytes) decoded = (decoded << 8) | byte;
    if (bytes != std::array<unsigned char, 4>{{1, 2, 3, 4}} ||
        decoded != value) return 1;
    std::cout << "wire=1,2,3,4 roundtrip=checked\n";
}
