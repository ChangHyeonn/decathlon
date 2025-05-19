import styled from "styled-components";
import TitleImage from "../assets/title.svg";
import SignInForm from "../components/SignInForm";

const ContainerDiv = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #272757;
`;

const TitleDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: inherit;
  text-decoration: none;
`;

const Title = styled.h1`
  font-size: 30px;
  font-weight: 800;
  color: white;
  margin: 10px 0;
`;

const Img = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 12px;
`;

const SigninPage = () => {
  return (
    <ContainerDiv>
      <TitleDiv>
        <Img src={TitleImage} />
        <Title>Decathlon</Title>
      </TitleDiv>
      <SignInForm />
    </ContainerDiv>
  );
};

export default SigninPage;
