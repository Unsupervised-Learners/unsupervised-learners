'use client';

import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import PlotlyMap from '../components/PlotlyMap';

export default function HomePage() {
  const [showPlants, setShowPlants] = useState(true);
  const [showCriticalHabitat, setShowCriticalHabitat] = useState(false);

  return (
    <main>
      <Container fluid className="py-3">
        <Row>
          {/* Visualization */}
          <Col xs={9}>
            <PlotlyMap
              showPlants={showPlants}
              showCriticalHabitat={showCriticalHabitat}
            />
          </Col>

          {/* Sidebar */}
          <Col
            xs={3}
            style={{
              borderLeft: '1px solid #ccc',
              paddingLeft: '20px',
              height: '100vh',
            }}
          >
            <h4>Layers</h4>
            <Form>
              <Form.Check
                type="checkbox"
                id="plants"
                label="Threatened & Endangered Plants"
                checked={showPlants}
                onChange={(e) => setShowPlants(e.target.checked)}
              />

              <Form.Check
                type="checkbox"
                id="criticalHabitat"
                label="Critical Habitat Areas"
                checked={showCriticalHabitat}
                onChange={(e) => setShowCriticalHabitat(e.target.checked)}
              />
            </Form>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
