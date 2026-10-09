#include "metric_api.h"
#include <new>

struct metric_context { int reserved = 0; };

metric_context* METRIC_CALL metric_open(void) noexcept {
    return new (std::nothrow) metric_context;
}
int32_t METRIC_CALL metric_clamp_percent(
    metric_context* context, int32_t value, int32_t* output) noexcept {
    if (!context || !output) return -1;
    *output = value < 0 ? 0 : (value > 100 ? 100 : value);
    return 0;
}
void METRIC_CALL metric_close(metric_context* context) noexcept { delete context; }
const metric_api* METRIC_CALL metric_get_api(uint32_t version) noexcept {
    static const metric_api api{sizeof(metric_api), 1,
                               &metric_open, &metric_clamp_percent, &metric_close};
    return version == 1 ? &api : nullptr;
}
