#include <condition_variable>
#include <cstddef>
#include <future>
#include <iostream>
#include <mutex>
#include <optional>
#include <queue>
#include <stdexcept>
#include <thread>
#include <utility>

class Executor {
    std::mutex mutex_;
    std::condition_variable changed_;
    std::queue<std::packaged_task<int()>> queue_;
    bool accepting_ = true;
    const std::size_t capacity_ = 2;
    std::thread worker_;
    void run() {
        for (;;) {
            std::packaged_task<int()> task;
            {
                std::unique_lock<std::mutex> lock(mutex_);
                changed_.wait(lock, [this] {
                    return !accepting_ || !queue_.empty();
                });
                if (queue_.empty()) return;
                task = std::move(queue_.front());
                queue_.pop();
            }
            task();
        }
    }
public:
    Executor() : worker_([this] { run(); }) {}
    Executor(const Executor&) = delete;
    Executor& operator=(const Executor&) = delete;
    ~Executor() { close_and_wait(); }
    template<class F>
    std::optional<std::future<int>> try_submit(F&& work) {
        std::packaged_task<int()> task(std::forward<F>(work));
        auto result = task.get_future();
        {
            std::lock_guard<std::mutex> lock(mutex_);
            if (!accepting_ || queue_.size() == capacity_)
                return std::nullopt;
            queue_.push(std::move(task));
        }
        changed_.notify_one();
        return std::optional<std::future<int>>(std::move(result));
    }
    void close_and_wait() {
        {
            std::lock_guard<std::mutex> lock(mutex_);
            accepting_ = false;
        }
        changed_.notify_all();
        if (worker_.joinable()) worker_.join();
    }
};

struct ReleaseGate {
    std::promise<void>& promise;
    bool released = false;
    void release() {
        if (!released) { promise.set_value(); released = true; }
    }
    ~ReleaseGate() { release(); }
};

int main() {
    std::promise<void> started, release;
    auto started_result = started.get_future();
    auto gate = release.get_future().share();
    Executor executor;
    ReleaseGate guard{release};
    auto first = executor.try_submit([&started, gate] {
        started.set_value();
        gate.wait();
        return 40;
    });
    if (!first) return 1;
    started_result.get();
    auto second = executor.try_submit([] { return 2; });
    auto failure = executor.try_submit([]() -> int {
        throw std::runtime_error("task failed");
    });
    const bool full_rejected = !executor.try_submit([] { return 99; });
    guard.release();
    executor.close_and_wait();
    const bool closed_rejected = !executor.try_submit([] { return 99; });
    if (!second || !failure || !full_rejected || !closed_rejected) return 2;
    const int result = first->get() + second->get();
    bool failed = false;
    try { static_cast<void>(failure->get()); }
    catch (const std::runtime_error&) { failed = true; }
    if (result != 42 || !failed) return 3;
    std::cout << "accepted=3 rejected=2 result=42 failures=1\n";
    return std::cout ? 0 : 4;
}
