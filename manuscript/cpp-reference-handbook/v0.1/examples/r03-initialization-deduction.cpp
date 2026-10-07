#include <iostream>
#include <type_traits>
#include <vector>

int main() {
    int zero{};
    const int source = 4;
    auto copy = source;
    auto& alias = source;
    decltype(auto) borrowed = (source);
    std::vector<int> repeated(3, 7);
    std::vector<int> listed{3, 7};
    static_assert(std::is_same_v<decltype(copy), int>);
    static_assert(std::is_same_v<decltype(alias), const int&>);
    static_assert(std::is_same_v<decltype(borrowed), const int&>);
    if (zero != 0 || repeated.size() != 3 ||
        repeated[2] != 7 || listed.size() != 2 || listed[0] != 3) {
        return 1;
    }
    std::cout << "zero=0 repeated=3 listed=2\n";
}
