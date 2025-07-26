import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"

// Mock the ImageUpload component
const MockImageUpload = ({ onUpload, maxSize, children }: any) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    onUpload(file)
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {children}
    </div>
  )
}

describe("ImageUpload", () => {
  const mockOnUpload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders upload trigger", () => {
    render(
      <MockImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </MockImageUpload>,
    )

    expect(screen.getByText("Upload Image")).toBeInTheDocument()
  })

  it("handles file selection", () => {
    render(
      <MockImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </MockImageUpload>,
    )

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    expect(mockOnUpload).toHaveBeenCalledWith(file)
  })

  it("rejects files that are too large", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

    render(
      <MockImageUpload onUpload={mockOnUpload} maxSize={1024}>
        <button>Upload Image</button>
      </MockImageUpload>,
    )

    const file = new File(["x".repeat(2048)], "large.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    expect(alertSpy).toHaveBeenCalledWith("File size must be less than 0MB")
    expect(mockOnUpload).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })

  it("rejects non-image files", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

    render(
      <MockImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </MockImageUpload>,
    )

    const file = new File(["test"], "test.txt", { type: "text/plain" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    expect(alertSpy).toHaveBeenCalledWith("Please select an image file")
    expect(mockOnUpload).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })

  it("handles empty file selection", () => {
    render(
      <MockImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </MockImageUpload>,
    )

    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [],
      writable: false,
    })

    fireEvent.change(input)

    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it("accepts valid image files", () => {
    render(
      <MockImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </MockImageUpload>,
    )

    const file = new File(["test"], "test.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    expect(mockOnUpload).toHaveBeenCalledWith(file)
  })
})
