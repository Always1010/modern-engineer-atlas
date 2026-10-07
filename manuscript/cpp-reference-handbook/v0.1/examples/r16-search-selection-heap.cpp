#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> partitioned{2, 1, 3, 4, 7, 6};
    if (!std::is_partitioned(partitioned.begin(), partitioned.end(),
                             [](int x) { return x < 4; })) return 1;
    auto bound = std::lower_bound(partitioned.begin(), partitioned.end(), 4);
    if (bound != partitioned.begin() + 3 || *bound != 4) return 2;

    std::vector<int> values{8, 2, 7, 1, 5, 3};
    auto nth = values.begin() + 2;
    std::nth_element(values.begin(), nth, values.end());
    if (*nth != 3) return 3;
    for (auto left = values.begin(); left != nth; ++left) {
        for (auto right = nth; right != values.end(); ++right) {
            if (*right < *left) return 4;
        }
    }

    std::vector<int> heap{4, 1, 7, 3};
    std::make_heap(heap.begin(), heap.end());
    if (!std::is_heap(heap.begin(), heap.end()) || heap.front() != 7) return 5;
    heap.push_back(9);
    std::push_heap(heap.begin(), heap.end());
    if (!std::is_heap(heap.begin(), heap.end()) || heap.front() != 9) return 6;
    std::pop_heap(heap.begin(), heap.end());
    if (heap.size() != 5 || heap.back() != 9 ||
        !std::is_heap(heap.begin(), heap.end() - 1)) return 7;
    const int popped = heap.back();
    heap.pop_back();
    if (heap.size() != 4 || heap.front() != 7) return 8;
    std::cout << "bound=" << *bound << " rank2=" << *nth
              << " popped=" << popped << " size=" << heap.size() << '\n';
}
