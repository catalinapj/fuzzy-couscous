package main

import (
	"fmt"
	"os"
)

func main() {
	value := os.Getenv("CUSTOM_VAR")
	fmt.Println(value)
}
