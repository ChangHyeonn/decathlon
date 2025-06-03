import { useState } from "react";
import styled from "styled-components";
import TheHeader from "../layout/TheHeader";
import { useQuery } from "@tanstack/react-query";
import { getCustomerList } from "../api/customerApi";
import CustomerList from "../components/customer/CustomerList";
import CustomerTitle from "../components/customer/CustomerTitle";
import CustomerModal from "../components/customer/CustomerModal";

const TableDiv = styled.div`
  width: 80%;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
`;

const TitleH2 = styled.h2`
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 500;
`;

const Box = styled.div`
  width: 20px;
  height: 30px;
  background-color: #272757;
`;

const DateDiv = styled.div`
  display: flex;
  gap: 10px;
  margin: 20px auto;
  font-size: 22px;
  font-weight: 500;
`;
const MessageH2 = styled.h2`
  margin: 40px auto;
  font-size: 20px;
  font-weight: 500;
`;

const Pagination = styled.p`
  display: flex;
  gap: 10px;
  margin: 20px auto;
  font-size: 18px;
`;
const ButtonPage = styled.button`
  font-size: 16px;
  border: 0;
  background-color: transparent;
  font-weight: ${({ selected }) => (selected ? "bold" : "normal")};
  cursor: pointer;
`;

const ButtonDate = styled.button`
  font-size: 22px;
  border: 0;
  background-color: transparent;
  font-weight: ${({ selected }) => (selected ? "bold" : "normal")};
  cursor: pointer;
`;

const CustomerPage = () => {
  const [dateObj, setDateObj] = useState(new Date(2025, new Date().getMonth(), new Date().getDate()));
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const date = getDateString(dateObj);

  const {
    data: customerData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["graph", page, date],
    queryFn: () => getCustomerList(page, date),
  });

  const handlePrevDate = () => {
    setDateObj((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDate = () => {
    setDateObj((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  if (isError || customerData?.error) {
    return (
      <>
        <TheHeader />
        <TableDiv>
          <TitleH2>
            <Box />
            고객별 추적 기록
          </TitleH2>
          <DateDiv>
            <ButtonDate onClick={handlePrevDate}>{`<`}</ButtonDate>
            {`${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`}
            <ButtonDate onClick={handleNextDate}>{`>`}</ButtonDate>
          </DateDiv>
          <MessageH2>{customerData?.error}</MessageH2>
        </TableDiv>
      </>
    );
  }

  if (isPending || !customerData.customer_tracking_records) {
    return (
      <>
        <TheHeader />
        <TableDiv>
          <TitleH2>
            <Box />
            고객별 추적 기록
          </TitleH2>
          <DateDiv>
            <ButtonDate onClick={handlePrevDate}>{`<`}</ButtonDate>
            {`${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`}
            <ButtonDate onClick={handleNextDate}>{`>`}</ButtonDate>
          </DateDiv>
          <MessageH2>{"Loading..."}</MessageH2>
        </TableDiv>
      </>
    );
  }

  const handleModalOpen = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <>
      <TheHeader />
      <TableDiv>
        <TitleH2>
          <Box />
          고객별 추적 기록
        </TitleH2>
        <DateDiv>
          <ButtonDate onClick={handlePrevDate}>{`<`}</ButtonDate>
          {`${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`}
          <ButtonDate onClick={handleNextDate}>{`>`}</ButtonDate>
        </DateDiv>
        <CustomerTitle
          title={customerData.customer_tracking_records ? Object.keys(customerData.customer_tracking_records[0]) : []}
        />
        {customerData.customer_tracking_records.map((customer) => {
          return (
            <CustomerList key={customer.customer_id} customer={customer} onClick={() => handleModalOpen(customer)} />
          );
        })}
        <Pagination>
          <ButtonPage onClick={() => setPage((p) => Math.max(1, p - 1))}>{`<`}</ButtonPage>
          {Array.from({ length: customerData?.pagination?.total_pages || 1 }, (_, index) => index + 1).map((num) => (
            <ButtonPage key={num} onClick={() => setPage(num)} style={{ fontWeight: page === num ? "bold" : "normal" }}>
              {num}
            </ButtonPage>
          ))}
          <ButtonPage onClick={() => setPage((p) => Math.min(p + 1, customerData?.pagination?.total_pages || 1))}>
            {`>`}
          </ButtonPage>
        </Pagination>
      </TableDiv>
      <CustomerModal isModalOpen={isModalOpen} handleModalClose={handleModalClose} customer={selectedCustomer} />
    </>
  );
};

export default CustomerPage;
