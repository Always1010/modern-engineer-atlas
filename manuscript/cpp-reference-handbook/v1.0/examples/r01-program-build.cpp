#include <iostream>

int twice(int value);

int main() {
    const int result = twice(21);
    if (result != 42) {
        std::cerr << "check failed\n";
        return 1;
    }
    std::cout << "result=" << result << '\n';
    return 0;
}

int twice(int value) {
    return value * 2;
}
