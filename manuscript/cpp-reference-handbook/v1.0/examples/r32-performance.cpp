#include <chrono>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <vector>
int main() {
    constexpr std::uint64_t n = 4096, rounds = 64;
    std::vector<std::uint64_t> values(n);
    std::iota(values.begin(), values.end(), std::uint64_t{0});
    std::uint64_t checksum = 0;
    const auto start = std::chrono::steady_clock::now();
    for (std::uint64_t r = 0; r < rounds; ++r) {
        ++values[static_cast<std::size_t>(r % n)];
        checksum += std::accumulate(values.begin(), values.end(),
                                    std::uint64_t{0});
    }
    const auto elapsed = std::chrono::steady_clock::now() - start;
    const auto expected = rounds * n * (n - 1) / 2 +
                          rounds * (rounds + 1) / 2;
    if (checksum != expected || elapsed < decltype(elapsed)::zero())
        return 1;
    std::cout << "checksum=" << checksum << " elapsed_ns="
              << std::chrono::duration_cast<std::chrono::nanoseconds>(elapsed).count()
              << '\n';
    return std::cout ? 0 : 2;
}
