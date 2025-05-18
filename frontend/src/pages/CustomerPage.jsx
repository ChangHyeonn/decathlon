import styled from "styled-components";
import TheHeader from "../layout/TheHeader";
import { customerData } from "../dummy";
// customerData는 더미 데이터 <- 이후에 api 연결하여 제거
import CustomerList from "../components/CustomerList";
import CustomerTitle from "../components/CustomerTitle";

const TableDiv = styled.div`
  width: 80%;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
`;

const TitleH2 = styled.h2`
  display: flex;
  gap: 15px;
  font-size: 24px;
  font-weight: 500;
`;

const Box = styled.div`
  width: 20px;
  height: 30px;
  background-color: #272757;
`;

const DateDiv = styled.div`
  margin: 20px auto;
  font-size: 22px;
  font-weight: 500;
`;

const Pagination = styled.p`
  margin: 20px auto;
  font-size: 18px;
`;

const CustomerPage = () => {
  return (
    <>
      <TheHeader />
      <TableDiv>
        <TitleH2>
          <Box />
          고객별 추적 기록
        </TitleH2>
        <DateDiv>
          {`<`} 5월 18일 {`>`}
        </DateDiv>
        <CustomerTitle title={customerData.length > 0 ? Object.keys(customerData[0]) : []} />
        {customerData.map((customer) => {
          return <CustomerList key={customer.id} customer={customer} />;
        })}
        <Pagination>{`< 1 2 3 4 >`}</Pagination>
      </TableDiv>
    </>
  );
};

export default CustomerPage;
