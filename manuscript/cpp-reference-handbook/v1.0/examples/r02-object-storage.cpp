#include <cstddef>
#include <cstring>
#include <iostream>
#include <new>
#include <type_traits>

struct Record { int value; unsigned char tag; };
struct Cell {
    int value;
    inline static int destroyed = 0;
    explicit Cell(int v) noexcept : value(v) {}
    ~Cell() noexcept { ++destroyed; }
};

int main() {
    static_assert(std::is_trivially_copyable_v<Record>);
    static_assert(std::is_standard_layout_v<Record>);
    Record source{7, 2}, copy{};
    std::memcpy(&copy, &source, sizeof source);
    if (copy.value != 7 || copy.tag != 2) return 1;
    alignas(Cell) std::byte storage[sizeof(Cell)];
    Cell* first = ::new (static_cast<void*>(storage)) Cell(11);
    const bool first_ok = first->value == 11;
    first->~Cell();
    Cell* second = ::new (static_cast<void*>(storage)) Cell(23);
    const bool second_ok = second->value == 23;
    second->~Cell();
    if (!first_ok || !second_ok || Cell::destroyed != 2) return 2;
    std::cout << "copy=7 reused=23 destroyed=2\n";
    return std::cout ? 0 : 3;
}
