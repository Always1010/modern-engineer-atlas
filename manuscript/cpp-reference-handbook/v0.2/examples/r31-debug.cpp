#include <cstddef>
#include <iostream>
#include <limits>
#include <optional>
#include <vector>
std::optional<int> checked_double(const std::vector<int>& v,
                                  std::size_t index) {
    if (index >= v.size()) return std::nullopt;
    const int x = v[index];
    if (x > std::numeric_limits<int>::max() / 2 ||
        x < std::numeric_limits<int>::min() / 2) return std::nullopt;
    return x * 2;
}
int main() {
    const std::vector<int> v{3, std::numeric_limits<int>::max(),
                            std::numeric_limits<int>::min()};
    if (checked_double(v, 0) != 6 || checked_double(v, 1) ||
        checked_double(v, 2) || checked_double(v, 3)) return 1;
    std::cout << "PASS normal, overflow, underflow, index\n";
    return std::cout ? 0 : 2;
}
