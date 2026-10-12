#include <array>
#include <cstddef>
#include <iostream>

std::array<int, 8> events{};
std::size_t count = 0;
void record(int event) noexcept {
    if (count < events.size()) events[count] = event;
    ++count;
}

struct Part {
    int end;
    Part(int begin, int finish) : end(finish) { record(begin); }
    ~Part() { record(end); }
};

struct Base {
    Base() { record(1); }
    virtual ~Base() { record(8); }
    virtual int value() const { return 0; }
};

struct Derived : Base {
    Part first{2, 7};
    Part second{3, 6};
    Derived() { record(4); }
    ~Derived() override { record(5); }
    int value() const override { return 42; }
};

int main() {
    {
        Derived object;
        const Base& view = object;
        if (view.value() != 42) return 1;
    }
    const std::array<int, 8> expected{1, 2, 3, 4, 5, 6, 7, 8};
    if (count != expected.size() || events != expected) return 2;
    std::cout << "order=1,2,3,4,5,6,7,8\n";
}
