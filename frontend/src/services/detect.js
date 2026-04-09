import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL;

export const detectVideo = async (file) => {
  console.log("UPLOAD KE API /api/detect")

  const formData = new FormData()
  formData.append("video", file)

  return axios.post(
    `${API_URL}/api/detect`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 0, // YOLO lama
    }
  )
}
