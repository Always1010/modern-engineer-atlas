#include <array>
#include <iostream>

int sum_values(const std::array<int, 3>& values) {
    int total = 1; // Deliberate logic error: an empty sum should start at zero.
    for (int value : values) {
        total += value;
    }
    return total;
}

int main() {
    const std::array<int, 3> values{1, 2, 3};
    std::cout << "sum=" << sum_values(values) << '\n';
}
