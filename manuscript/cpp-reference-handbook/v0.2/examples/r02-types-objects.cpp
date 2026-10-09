#include <iostream>
#include <limits>
#include <type_traits>

enum class State : unsigned char { idle, ready };
struct Record { int id; double weight; };

int main() {
    int values[]{3, 5, 7};
    int (&whole)[3] = values;
    int* first = values;
    auto [id, weight] = Record{9, 2.5};
    static_assert(std::is_same_v<decltype(whole), int (&)[3]>);
    static_assert(sizeof(values) == 3 * sizeof(int));
    if (first != &values[0] || whole[2] != 7 ||
        id != 9 || weight != 2.5 ||
        std::numeric_limits<int>::max() < 32767) {
        return 1;
    }
    std::cout << "array=3 record=9,2.5\n";
}
