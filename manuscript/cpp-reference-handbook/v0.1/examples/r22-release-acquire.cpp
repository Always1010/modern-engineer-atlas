#include <exception>
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    try {
        int payload = 0;
        std::atomic<bool> ready{false};
        std::thread publisher([&] {
            payload = 42;
            ready.store(true, std::memory_order_release);
        });
        while (!ready.load(std::memory_order_acquire)) {
            std::this_thread::yield();
        }
        const int observed = payload;
        publisher.join();
        if (observed != 42) return 1;
        std::atomic<int> counter{0};
        int expected = 0;
        if (!counter.compare_exchange_strong(expected, 7)) return 2;
        expected = 0;
        if (counter.compare_exchange_strong(expected, 9) || expected != 7)
            return 3;
        std::cout << "payload=42 CAS-failure-observed=7\n";
    } catch (const std::exception& e) {
        std::cerr << e.what() << '\n';
        return 4;
    }
}
