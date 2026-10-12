#include "metric.h"
#include <iostream>
int main() {
    if (clamp_percent(-1) != 0 || clamp_percent(42) != 42 ||
        clamp_percent(101) != 100) return 1;
    std::cout << "PASS clamp_percent\n";
    return std::cout ? 0 : 2;
}
