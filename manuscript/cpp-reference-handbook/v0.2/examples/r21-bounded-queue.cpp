#include <exception>
#include <condition_variable>
#include <cstddef>
#include <deque>
#include <future>
#include <iostream>
#include <mutex>
#include <utility>

class Queue {
    std::mutex mutex_;
    std::condition_variable readable_, writable_;
    std::deque<int> items_;
    bool closed_ = false;
    static constexpr std::size_t capacity_ = 2;
public:
    bool push(int value) {
        std::unique_lock<std::mutex> lock(mutex_);
        writable_.wait(lock, [&] {
            return closed_ || items_.size() < capacity_;
        });
        if (closed_) return false;
        items_.push_back(value);
        lock.unlock();
        readable_.notify_one();
        return true;
    }
    bool pop(int& value) {
        std::unique_lock<std::mutex> lock(mutex_);
        readable_.wait(lock, [&] { return closed_ || !items_.empty(); });
        if (items_.empty()) return false;
        value = items_.front();
        items_.pop_front();
        lock.unlock();
        writable_.notify_one();
        return true;
    }
    void close() {
        {
            std::lock_guard<std::mutex> lock(mutex_);
            closed_ = true;
        }
        readable_.notify_all();
        writable_.notify_all();
    }
};

int main() {
    try {
        Queue queue;
        auto consumer = std::async(std::launch::async, [&] {
            int value = 0, sum = 0, count = 0;
            while (queue.pop(value)) { sum += value; ++count; }
            return std::pair<int, int>{sum, count};
        });
        try {
            for (int i = 1; i <= 5; ++i) {
                if (!queue.push(i)) { queue.close(); return 1; }
            }
        } catch (...) {
            queue.close();
            throw;
        }
        queue.close();
        const auto result = consumer.get();
        if (result.first != 15 || result.second != 5) return 2;
        std::cout << "count=5 sum=15 closed=drained\n";
    } catch (const std::exception& e) {
        std::cerr << e.what() << '\n';
        return 3;
    }
}
