#include <algorithm>
#include <iostream>
#include <iterator>
#include <numeric>
#include <vector>

int main() {
    std::vector<int> v{5, 2, 4, 1, 3};
    auto new_end = std::remove_if(v.begin(), v.end(),
                                  [](int x) { return x % 2 == 0; });
    if (v.size() != 5 || std::distance(v.begin(), new_end) != 3) return 1;
    v.erase(new_end, v.end());
    std::sort(v.begin(), v.end());
    if (v != std::vector<int>{1, 3, 5}) return 2;
    auto pos = std::lower_bound(v.begin(), v.end(), 3);
    if (pos == v.end() || *pos != 3) return 3;
    const auto sum = std::accumulate(v.begin(), v.end(), 0LL);
    if (sum != 9) return 4;
    std::cout << "size=3 sorted=1,3,5 sum=9\n";
}
