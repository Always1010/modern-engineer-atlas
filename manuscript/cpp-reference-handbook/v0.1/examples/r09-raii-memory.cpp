#include <iostream>
#include <memory>
#include <utility>

struct Item {
    static int live;
    int value;
    explicit Item(int n) : value(n) { ++live; }
    ~Item() { --live; }
};
int Item::live = 0;

int main() {
    std::weak_ptr<Item> observer;
    {
        auto owner = std::make_unique<Item>(7);
        auto moved = std::move(owner);
        if (owner || moved->value != 7 || Item::live != 1) return 1;
        auto shared = std::make_shared<Item>(42);
        observer = shared;
        auto locked = observer.lock();
        if (!locked || locked->value != 42 || Item::live != 2) return 2;
        shared.reset();
        if (observer.expired()) return 3;
        locked.reset();
        if (!observer.expired() || Item::live != 1) return 4;
    }
    if (Item::live != 0 || observer.lock()) return 5;
    std::cout << "released=all weak=expired\n";
}
