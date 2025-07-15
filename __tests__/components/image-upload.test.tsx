import { render, screen, fireEvent } from "@testing-library/react"
import { ImageUpload } from "@/components/ui/image-upload"
import jest from "jest"

describe("ImageUpload", () => {
  const mockOnUpload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders upload trigger", () => {
    render(
      <ImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </ImageUpload>,
    )

    expect(screen.getByText("Upload Image")).toBeInTheDocument()
  })

  it("handles file selection", () => {
    render(
      <ImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </ImageUpload>,
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
      <ImageUpload onUpload={mockOnUpload} maxSize={1024}>
        <button>Upload Image</button>
      </ImageUpload>,
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
      <ImageUpload onUpload={mockOnUpload}>
        <button>Upload Image</button>
      </ImageUpload>,
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
})
