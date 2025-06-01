import styled from "styled-components";

const CustomerItem = styled.div`
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: auto;
  padding: 16px 12px;
  border-bottom: 1px solid black;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const Info = styled.div`
  font-size: 18px;
  min-width: 50px;
  text-align: center;
  flex: 1;
`;

const CustomerList = ({ customer, onClick }) => {
  const entries = Object.entries(customer).filter(([key]) => key !== "zone_entrance" && key !== "zone_checkout");

  const renderValue = (key, value) => {
    if (typeof value === "boolean") {
      return value ? "O" : "X";
    } else if (key === "customer_id" || key === "score") {
      return value;
    }
    return `${value}초`;
  };

  return (
    <CustomerItem onClick={onClick}>
      {entries.map(([key, value]) => (
        <Info key={key}>{renderValue(key, value)}</Info>
      ))}
    </CustomerItem>
  );
};

export default CustomerList;
