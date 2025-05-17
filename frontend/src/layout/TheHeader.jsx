import styled from "styled-components";
import TitleImage from "../assets/title.svg";

const Header = styled.header`
  width: 100%;
  height: 5rem;
  background-color: #272757;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Nav = styled.nav`
  width: 100%;
  margin: 35px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Img = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 12px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 26px;
  font-weight: 800;
  color: white;
  margin: 0;
`;

const NavList = styled.ul`
  font-size: 18px;
  font-weight: 600;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NavItem = styled.li`
  color: white;
  margin: 0 0.5rem;
`;

const LogoutButton = styled.button`
  font-size: 18px;
  font-weight: 600;
  padding: 12px 25px;
  background: transparent;
  border: none;
  border-radius: 16px;
  background-color: white;
  color: black;
  cursor: pointer;
`;

const TheHeader = () => {
  return (
    <Header>
      <Nav>
        <Title>
          <Img src={TitleImage} alt="" />
          Decathlon
        </Title>
        <NavList>
          <NavItem>섹션별 체류 시간</NavItem>
          <NavItem>고객별 추적 기록</NavItem>
          <NavItem>
            <LogoutButton>로그아웃</LogoutButton>
          </NavItem>
        </NavList>
      </Nav>
    </Header>
  );
};

export default TheHeader;
