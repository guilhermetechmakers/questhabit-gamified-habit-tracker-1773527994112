export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput {
  email: string
  password: string
  display_name?: string
}

export interface AuthResponse {
  user: { id: string; email?: string }
  token?: string
}
