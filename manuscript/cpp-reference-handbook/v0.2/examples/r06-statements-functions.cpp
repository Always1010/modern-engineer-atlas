#include <functional>
#include <iostream>
#include <memory>
#include <vector>

std::function<int(int)> make_adder(int base) {
    return [base](int value) { return base + value; };
}

int main() {
    std::vector<int> values{1, 2, 3};
    int total = 0;
    for (int value : values) total += value;
    auto add = make_adder(total);
    auto owned = [p = std::make_unique<int>(5)](int value) {
        return *p + value;
    };
    if (std::invoke(add, 4) != 10 || std::invoke(owned, 7) != 12) {
        return 1;
    }
    std::cout << "callback=10 owned=12\n";
}
