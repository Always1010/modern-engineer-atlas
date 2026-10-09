#include <iostream>
#include <limits>
#include <type_traits>
#include <utility>

bool checked_add(int a, int b, int& result) {
    const int hi = std::numeric_limits<int>::max();
    const int lo = std::numeric_limits<int>::min();
    if ((b > 0 && a > hi - b) || (b < 0 && a < lo - b)) {
        return false;
    }
    result = a + b;
    return true;
}

int main() {
    int value = 7;
    static_assert(std::is_same_v<decltype((value)), int&>);
    static_assert(std::is_same_v<decltype(std::move(value)), int&&>);
    int sum = 0;
    if (!checked_add(20, 22, sum) || sum != 42) return 1;
    if (checked_add(std::numeric_limits<int>::max(), 1, sum)) return 2;
    if (sum != 42) return 3;
    std::cout << "sum=42 overflow=rejected\n";
}
