#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>

int main() {
    std::string owner("ab\0cd", 5);
    std::string_view all(owner.data(), owner.size());
    auto tail = all.substr(3);
    if (owner.size() != 5 || tail != "cd" || all[2] != '\0') return 1;
    owner[3] = 'X';
    if (tail != "Xd") return 2;
    std::string saved(tail);
    bool checked = false;
    try { (void)all.at(5); }
    catch (const std::out_of_range&) { checked = true; }
    if (!checked) return 3;
    owner.append(100, '!');
    // all and tail are not used after modifying owner.
    if (saved != "Xd") return 4;
    std::cout << "bytes=5 saved=Xd boundary=checked\n";
}
