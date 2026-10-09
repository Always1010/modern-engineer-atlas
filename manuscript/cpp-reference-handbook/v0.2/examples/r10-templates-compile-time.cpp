#include <cstddef>
#include <iostream>
#include <string>
#include <type_traits>

template<class... T>
auto sum(T... values) {
    return (0 + ... + values);
}

template<class T>
std::size_t extent(const T& value) {
    if constexpr (std::is_integral_v<T>) {
        return 1;
    } else {
        return value.size();
    }
}

template<class T>
struct Box {
    using value_type = T;
    T value;
};

template<class B>
typename B::value_type read(const B& box) {
    return box.value;
}

int main() {
    Box<int> box{9};
    if (sum() != 0 || sum(1, 2, 3) != 6 ||
        extent(42) != 1 || extent(std::string("abc")) != 3 ||
        read(box) != 9) {
        return 1;
    }
    std::cout << "sum=6 extent=1,3 box=9\n";
}
