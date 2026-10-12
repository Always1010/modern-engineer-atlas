#include <iostream>
#include <memory>
#include <utility>

int category(int&) { return 1; }
int category(int&&) { return 2; }

template<class T>
int relay(T&& value) {
    return category(std::forward<T>(value));
}

struct Immovable {
    Immovable() = default;
    Immovable(const Immovable&) = delete;
    Immovable(Immovable&&) = delete;
};
Immovable make_value() { return Immovable{}; }

int main() {
    int value = 7;
    if (relay(value) != 1 || relay(7) != 2) return 1;
    auto owner = std::make_unique<int>(42);
    int* address = owner.get();
    auto next = std::move(owner);
    if (owner || next.get() != address || *next != 42) return 2;
    [[maybe_unused]] auto fixed = make_value();
    std::cout << "forward=1,2 owner=42\n";
}
