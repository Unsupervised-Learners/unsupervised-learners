import { Col, Container } from 'react-bootstrap';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Header = () => (
  <header className="mt-auto py-3 bg-light">
    <Container>
      <Col className="text-center">
        EcoMap: Hawaiʻi’s Threatened Plants
        <br />
        University of Hawaii
        <br />
        Honolulu, HI 96822
        <br />
        <a href="http://ics-software-engineering.github.io/nextjs-application-template">Template Home Page</a>
      </Col>
    </Container>
  </header>
);

export default Footer;
