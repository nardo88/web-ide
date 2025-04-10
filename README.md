Перед использованием на сервере должны быть доступны Docker образы

Python - docker pull python:3.9
Php - docker pull php:8.2-cli
TypeScript - docker pull node:20

Пример Python ================================================

def add_numbers(a, b):
"""Складывает два числа и возвращает результат."""
result = a + b
return result

# Пример использования

num1 = 5
num2 = 3
sum_result = add_numbers(num1, num2)
print(f"Сумма чисел {num1} и {num2} равна: {sum_result}")

print("Hello world")

PHP ===========================================================

function add\*numbers($a, $b) {
/\** Складывает два числа и возвращает результат. \_/
$result = $a + $b;
return $result;
}

// Пример использования
$num1 = 5;
$num2 = 3;
$sum_result = add_numbers($num1, $num2);
echo "Сумма чисел $num1 и $num2 равна: $sum_result\n";
echo "Hello world\n";

TypeScript ======================================
