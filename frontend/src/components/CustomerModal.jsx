import styled from "styled-components";

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ModalBox = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  background: #fff;
  border-radius: 16px;
  padding: 50px;
  z-index: 1001;
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  float: right;
`;

const DetailDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: 20px 0;
  font-size: 16px;
  font-weight: 500;
`;
const CustomerDataDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const CustomerMovementDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const LineDiv = styled.div`
  width: 1px;
  min-height: 100px;
  background-color: black;
  margin: 0 20px;
`;

const TitleH2 = styled.h2`
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const ContextP = styled.p`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
`;

const CustomerModal = ({ isModalOpen, handleModalClose, customer }) => {
  if (!isModalOpen || !customer) return null;
  return (
    <ModalBackdrop onClick={handleModalClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleModalClose}>×</CloseButton>
        <DetailDiv>
          <CustomerDataDiv>
            <TitleH2>고객 데이터</TitleH2>
            <ContextP>25/05/14 14:17 - 25/05/14 14:30</ContextP>
            <ContextP>고객 {customer.id}</ContextP>
            <ContextP>총 체류 시간: 724초</ContextP>
            <ContextP>구매 여부: X</ContextP>
          </CustomerDataDiv>
          <LineDiv />
          <CustomerMovementDiv>
            <TitleH2>고객 이동 동선</TitleH2>
            <ContextP>{`러닝화 -> 등산화 -> 언더웨어 -> 상의 ->`}</ContextP>
            <ContextP>{`아우터 -> 상의 -> 아우터 -> 하의 -> 상의`}</ContextP>
            <ContextP>{`-> 아우터`}</ContextP>
          </CustomerMovementDiv>
        </DetailDiv>
      </ModalBox>
    </ModalBackdrop>
  );
};

export default CustomerModal;
