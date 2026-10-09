#include <functional>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    std::map<std::string, int> counts;
    auto a = counts.try_emplace("red", 1);
    auto b = counts.try_emplace("red", 9);
    if (!a.second || b.second || counts.at("red") != 1) return 1;
    counts.insert_or_assign("red", 3);
    if (counts.find("missing") != counts.end() || counts.size() != 1) return 2;
    std::unordered_map<int, std::string> names{{7, "seven"}};
    const auto* saved = &names.at(7);
    names.rehash(names.bucket_count() * 2 + 1);
    if (*saved != "seven") return 3;
    std::priority_queue<int, std::vector<int>, std::greater<int>> q;
    q.push(9); q.push(2); q.push(5);
    std::vector<int> out;
    while (!q.empty()) { out.push_back(q.top()); q.pop(); }
    if (out != std::vector<int>{2, 5, 9}) return 4;
    std::cout << "red=3 reference=seven heap=2,5,9\n";
}
