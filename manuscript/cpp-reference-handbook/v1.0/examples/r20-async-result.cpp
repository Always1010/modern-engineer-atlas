#include <exception>
#include <future>
#include <iostream>
#include <stdexcept>

int main() {
    try {
        auto value = std::async(std::launch::async, [] { return 6 * 7; });
        auto failure = std::async(std::launch::deferred, []() -> int {
            throw std::runtime_error("task failed");
        });
        if (value.get() != 42 || value.valid()) return 1;
        bool caught = false;
        try {
            (void)failure.get();
        } catch (const std::runtime_error&) {
            caught = true;
        }
        if (!caught || failure.valid()) return 2;
        std::cout << "result=42 exception=checked\n";
    } catch (const std::exception& e) {
        std::cerr << e.what() << '\n';
        return 3;
    }
}
