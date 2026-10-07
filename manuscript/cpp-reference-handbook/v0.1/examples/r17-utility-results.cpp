#include <any>
#include <iostream>
#include <optional>
#include <string>
#include <tuple>
#include <type_traits>
#include <variant>

int main() {
    std::tuple<int, std::string> record{7, "Ada"};
    auto& [id, name] = record;
    id = 8;
    std::optional<int> missing;
    if (missing || missing.value_or(42) != 42) return 1;
    missing.emplace(id);
    std::variant<int, std::string> result = name;
    auto text = std::visit([](const auto& x) -> std::string {
        using T = std::decay_t<decltype(x)>;
        if constexpr (std::is_same_v<T, int>) return std::to_string(x);
        else return x;
    }, result);
    std::any box = id;
    auto p = std::any_cast<int>(&box);
    if (!p || *p != 8 || std::any_cast<double>(&box) != nullptr) return 2;
    if (*missing != 8 || text != "Ada" || std::get<0>(record) != 8) return 3;
    std::cout << "id=8 optional=8 variant=Ada any=8\n";
}
