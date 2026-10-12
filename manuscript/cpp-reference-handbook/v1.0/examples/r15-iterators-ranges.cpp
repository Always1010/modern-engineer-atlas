#include <algorithm>
#include <iostream>
#include <iterator>
#include <list>
#include <vector>

int main() {
    std::list<int> source{10, 20, 30};
    auto it = source.begin();
    std::advance(it, 2);
    if (*it != 30 || std::distance(source.begin(), source.end()) != 3) return 1;
    std::vector<int> out;
    std::copy(source.rbegin(), source.rend(), std::back_inserter(out));
    if (out != std::vector<int>{30, 20, 10}) return 2;
    if (source.rbegin().base() != source.end()) return 3;
    auto empty = std::find(source.begin(), source.end(), 99);
    if (empty != source.end()) return 4;
    std::cout << "distance=3 reverse=30,20,10 miss=end\n";
}
