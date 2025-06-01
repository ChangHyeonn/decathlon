import { useState } from "react";
import styled from "styled-components";
import TheHeader from "../layout/TheHeader";
import { useQuery } from "@tanstack/react-query";
import { getCustomerList } from "../api/customerApi";
import CustomerList from "../components/CustomerList";
import CustomerTitle from "../components/CustomerTitle";
import CustomerModal from "../components/CustomerModal";

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
  margin: 20px auto;
  font-size: 22px;
  font-weight: 500;
`;

const Pagination = styled.p`
  margin: 20px auto;
  font-size: 18px;
`;

const CustomerPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const {
    data: customerData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["graph"],
    queryFn: getCustomerList,
  });

  if (isPending || !customerData.customer_tracking_records) {
    return (
      <>
        <TheHeader />
        <TableDiv>
          <TitleH2>
            <Box />
            고객별 추적 기록
          </TitleH2>
          <h2>Loading...</h2>
        </TableDiv>
      </>
    );
  }
  if (isError) {
    return (
      <>
        <TheHeader />
        <TableDiv>
          <TitleH2>
            <Box />
            고객별 추적 기록
          </TitleH2>
          <h2>Error fetching posts</h2>
        </TableDiv>
      </>
    );
  }

  if (customerData) {
    console.log(customerData);
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
        <DateDiv>{`${customerData.month}월 ${customerData.day}일`}</DateDiv>
        <CustomerTitle
          title={customerData.customer_tracking_records ? Object.keys(customerData.customer_tracking_records[0]) : []}
        />
        {customerData.customer_tracking_records.map((customer) => {
          return (
            <CustomerList key={customer.customer_id} customer={customer} onClick={() => handleModalOpen(customer)} />
          );
        })}
        <Pagination>{`< 1 2 3 4 >`}</Pagination>
      </TableDiv>
      <CustomerModal isModalOpen={isModalOpen} handleModalClose={handleModalClose} customer={selectedCustomer} />
    </>
  );
};

export default CustomerPage;
