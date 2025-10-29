import enum

class UserRole(str, enum.Enum):
    Author = "Author"
    Editor = "Editor"
    Admin  = "Admin"

