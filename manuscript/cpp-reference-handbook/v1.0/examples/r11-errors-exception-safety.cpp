#include <iostream>
#include <stdexcept>
#include <vector>

struct Active {
    int& count;
    explicit Active(int& value) : count(value) { ++count; }
    ~Active() { --count; }
};

void append_transaction(std::vector<int>& target, int value,
                        bool inject_failure, int& active) {
    Active guard(active);
    auto staged = target;
    staged.push_back(value);
    if (inject_failure) throw std::runtime_error("before commit");
    target.swap(staged);
}

int main() {
    std::vector<int> values{1, 2};
    int active = 0;
    bool caught = false;
    try {
        append_transaction(values, 3, true, active);
    } catch (const std::runtime_error&) {
        caught = true;
    } catch (...) {
        return 1;
    }
    if (!caught || values != std::vector<int>{1, 2} || active != 0) return 2;
    try {
        append_transaction(values, 3, false, active);
    } catch (...) {
        return 3;
    }
    if (values != std::vector<int>{1, 2, 3} || active != 0) return 4;
    std::cout << "rollback=ok commit=ok active=0\n";
}
