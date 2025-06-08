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
  color: ${({ $highlight }) => $highlight};
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

  const renderHighlight = (key, value) => {
    let highlight = false;
    if (key !== "customer_id" && key !== "score" && typeof value === "number") {
      if (value >= 600) {
        highlight = "#FF242C";
      } else if (value >= 400) {
        highlight = "#DB1F26";
      }
    }
    if (key === "score") {
      if (value >= 90) {
        highlight = "#FF242C";
      } else if (value >= 80) {
        highlight = "#DB1F26";
      }
    }
    return highlight;
  };

  return (
    <CustomerItem onClick={onClick}>
      {entries.map(([key, value]) => {
        return (
          <Info key={key} $highlight={renderHighlight(key, value)}>
            {renderValue(key, value)}
          </Info>
        );
      })}
    </CustomerItem>
  );
};

export default CustomerList;
