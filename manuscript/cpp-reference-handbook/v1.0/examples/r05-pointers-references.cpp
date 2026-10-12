#include <iostream>
#include <string>

struct Owner { std::string text; };

int* find_value(int* first, int* last, int wanted) {
    for (; first != last; ++first) {
        if (*first == wanted) return first;
    }
    return nullptr;
}

int main() {
    int values[]{2, 4, 6};
    int* found = find_value(values, values + 3, 4);
    if (!found || *found != 4) return 1;
    *found = 5;
    if (values[1] != 5 || find_value(values, values + 3, 9)) return 2;
    const Owner& kept = Owner{"alive"};
    if (kept.text != "alive") return 3;
    std::cout << "found=5 kept=alive\n";
}
