#include "metric_check.h"
int main() {
    const metric_api api{sizeof(metric_api), 1,
                        &metric_open, &metric_clamp_percent, &metric_close};
    if (!check_metric(api)) return 1;
    std::cout << "PASS linked metric: 0 42 100\n";
    return std::cout ? 0 : 2;
}
