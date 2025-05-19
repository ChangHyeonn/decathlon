import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const ContainerDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 40px 50px;
  border-radius: 12px;
  background-color: #ffffff;
`;

const TitleH2 = styled.h2`
  gap: 15px;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const FormDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  gap: 5px;
  margin-bottom: 20px;
`;

const Label = styled.label`
  font-size: 18px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 300px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 12px;
  font-size: 16px;
  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 12px;
  background-color: #272757;
  color: white;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #141432;
  }
`;

const SignInForm = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get("id");
    const password = formData.get("password");

    if (id === "admin" && password === "admin") {
      navigate("/section");
    } else {
      alert("아이디 또는 비밀번호가 잘못되었습니다.");
    }
  };

  return (
    <ContainerDiv>
      <TitleH2>로그인</TitleH2>
      <form onSubmit={handleSubmit}>
        <FormDiv>
          <Label htmlFor="id">아이디</Label>
          <Input type="id" id="id" name="id" required />
        </FormDiv>
        <FormDiv>
          <Label htmlFor="password">비밀번호</Label>
          <Input type="password" id="password" name="password" required />
        </FormDiv>
        <Button type="submit">Sign In</Button>
      </form>
    </ContainerDiv>
  );
};
export default SignInForm;
