#include <iostream> 

int fib(int x){
    if (x <= 1) return 1;    
    return fib(x-1) + fib(x-2);
}

int main() {
    std::cout << "First 5 Fibonacci numbers:" << std::endl;
    for(int i = 0; i < 5; i++){
        std::cout << fib(i) << ' ';
    }
    return 0;
}