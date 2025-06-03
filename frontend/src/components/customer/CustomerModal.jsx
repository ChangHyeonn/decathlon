import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { getCustomerDetail } from "../../api/customerApi";

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
  position: absolute;
  top: 15px;
  right: 20px;
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
  flex: 1;
`;
const CustomerMovementDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
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
  line-height: 1.8;
  text-align: center;
  overflow-wrap: break-word;
  white-space: pre-wrap;
`;

const CustomerModal = ({ isModalOpen, handleModalClose, customer }) => {
  const { data: customerDetail } = useQuery({
    queryKey: ["customer101"],
    queryFn: getCustomerDetail,
  });

  const generateLog = (logs) => {
    if (!logs || logs.length === 0) return "";
    return logs.join(" -> ");
  };

  if (!isModalOpen || !customer) return null;
  return (
    <ModalBackdrop onClick={handleModalClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleModalClose}>×</CloseButton>
        <DetailDiv>
          <CustomerDataDiv>
            <TitleH2>고객 데이터</TitleH2>
            <ContextP>{customerDetail.customer_data.tracking_period}</ContextP>
            <ContextP>고객 {customerDetail.customer_data.id}</ContextP>
            <ContextP>총 체류 시간: {customerDetail.customer_data.total_stay_time_seconds}초</ContextP>
            <ContextP>구매 여부: {customerDetail.customer_data.purchase_state ? "X" : "O"}</ContextP>
          </CustomerDataDiv>
          <LineDiv />
          <CustomerMovementDiv>
            <TitleH2>고객 이동 동선</TitleH2>
            <ContextP>{generateLog(customerDetail.customer_movement_log)}</ContextP>
          </CustomerMovementDiv>
        </DetailDiv>
      </ModalBox>
    </ModalBackdrop>
  );
};

export default CustomerModal;
