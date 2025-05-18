import styled from "styled-components";

const CustomerItem = styled.div`
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: auto;
  padding: 16px 12px;
  border-top: 1px solid black;
  border-bottom: 1px solid black;
`;

const Info = styled.div`
  font-size: 18px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
  flex: 1;
`;

const CustomerTitle = ({ title }) => {
  const renderValue = (value) => {
    if (value === "id") {
      return "고객";
    } else if (value === "buyCheck") {
      return "구매 여부";
    }
    return value;
  };

  return (
    <CustomerItem>
      {title.map((value, index) => (
        <Info key={index}>{renderValue(value)}</Info>
      ))}
    </CustomerItem>
  );
};

export default CustomerTitle;
