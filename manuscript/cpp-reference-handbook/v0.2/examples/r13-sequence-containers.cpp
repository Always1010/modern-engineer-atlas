// C++17 sample and semantic checks for chapter R13.
#include <algorithm>
#include <array>
#include <deque>
#include <forward_list>
#include <iostream>
#include <list>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

void require(bool condition, const char* message) {
    if (!condition) throw std::runtime_error(message);
}

void sample_01() {
    // BEGIN sample-01
    std::vector<int> a(3, 7);   // 三个 7：{7, 7, 7}
    std::vector<int> b{3, 7};   // 两个元素：{3, 7}
    std::array<int, 3> c{};     // 三个 0
    // END sample-01
    require(a == std::vector<int>({7, 7, 7}), "count initialization");
    require(b == std::vector<int>({3, 7}), "list initialization");
    require(c == std::array<int, 3>{0, 0, 0}, "array zero initialization");
}

void sample_02() {
    // BEGIN sample-02
    std::vector<int> v{10, 20, 30};
    v.reserve(6);              // size 仍为 3，capacity 至少为 6
    v.push_back(40);           // 创建第 4 个元素
    v.resize(6, -1);           // {10, 20, 30, 40, -1, -1}
    v.resize(2);               // {10, 20}；capacity 不变
    // END sample-02
    require(v == std::vector<int>({10, 20}), "resize content");
    require(v.capacity() >= 6, "resize did not shrink capacity");
    std::vector<int> probe{10, 20, 30};
    probe.reserve(6);
    require(probe.size() == 3 && probe.capacity() >= 6, "reserve is not resize");
    const auto capacity = probe.capacity();
    probe.resize(6, -1);
    require(probe == std::vector<int>({10, 20, 30, -1, -1, -1}), "resize fill");
    probe.clear();
    require(probe.empty() && probe.capacity() == capacity, "clear retains capacity");
    bool caught = false;
    try { (void)probe.at(0); } catch (const std::out_of_range&) { caught = true; }
    require(caught, "at rejects empty sequence");
}

void sample_03() {
    // BEGIN sample-03
    std::vector<int> v{1, 2, 3, 4, 5};
    for (auto it = v.begin(); it != v.end(); ) {
        if (*it % 2 == 0) {
            it = v.erase(it);
        } else {
            ++it;
        }
    }                         // {1, 3, 5}
    // END sample-03
    require(v == std::vector<int>({1, 3, 5}), "erase loop");
}

void sample_04() {
    std::vector<int> v{1, 2, 3, 4, 5};
    // BEGIN sample-04
    v.erase(std::remove_if(v.begin(), v.end(),
                          [](int x) { return x % 2 == 0; }),
            v.end());         // C++17；还需要 <algorithm>
    // END sample-04
    require(v == std::vector<int>({1, 3, 5}), "erase remove");
#if __cplusplus >= 202002L
    std::vector<int> modern{1, 2, 3, 4, 5};
    const auto erased = std::erase_if(modern, [](int x) { return x % 2 == 0; });
    require(erased == 2 && modern == std::vector<int>({1, 3, 5}), "C++20 erase_if");
#endif
}

void sample_05() {
    // BEGIN sample-05
    std::deque<int> q{10, 20};
    int& first = q.front();
    q.push_back(30);
    first = 11;               // 有效：引用保留，q 为 {11, 20, 30}
    // 若之前保存了 q.begin()，这里不可再使用那个旧迭代器。
    // END sample-05
    require(q == std::deque<int>({11, 20, 30}), "deque retained reference");
    require(&first == &q.front(), "deque object address");
    q.pop_front();
    require(q == std::deque<int>({20, 30}), "deque pop front");
}

void sample_06() {
    // BEGIN sample-06
    std::list<int> ready{10, 20};
    std::list<int> active;
    auto item = ready.begin();
    active.splice(active.end(), ready, item);
    // ready = {20}，active = {10}；item 仍指向 10，但属于 active。
    // END sample-06
    require(ready == std::list<int>({20}) && active == std::list<int>({10}), "splice contents");
    require(item == active.begin() && *item == 10, "splice iterator belongs to target");
}

void sample_07() {
    // BEGIN sample-07
    std::forward_list<int> f{1, 2, 3, 4};
    auto prev = f.before_begin();
    auto cur = f.begin();
    while (cur != f.end()) {
        if (*cur % 2 == 0) {
            cur = f.erase_after(prev);
        } else {
            prev = cur;
            ++cur;
        }
    }                         // {1, 3}
    // END sample-07
    require(f == std::forward_list<int>({1, 3}), "erase after loop");
}

void sample_08() {
    // BEGIN sample-08
    std::vector<std::unique_ptr<int>> owners;
    owners.push_back(std::make_unique<int>(42));
    int* saved = owners.front().get();     // 借用所指对象，不是 &owners[0]
    owners.reserve(owners.capacity() + 1); // 此处强制重分配
    *saved = 43;                          // 有效：该对象仍被拥有
    // END sample-08
    require(saved == owners.front().get() && *saved == 43, "owned object address");
    require(owners.size() == 1 && owners.capacity() >= 2, "owner vector grew");
}

int main() {
    try {
        sample_01();
        std::cout << "PASS sample-01\n";
        sample_02();
        std::cout << "PASS sample-02\n";
        sample_03();
        std::cout << "PASS sample-03\n";
        sample_04();
        std::cout << "PASS sample-04\n";
        sample_05();
        std::cout << "PASS sample-05\n";
        sample_06();
        std::cout << "PASS sample-06\n";
        sample_07();
        std::cout << "PASS sample-07\n";
        sample_08();
        std::cout << "PASS sample-08\n";
        std::cout << "PASS all 8 samples\n";
        if (!std::cout) return 2;
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "FAIL: " << error.what() << '\n';
        return 1;
    }
}
