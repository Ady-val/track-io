/// <reference types="cypress" />

describe("CatalogsPage - Tests E2E", () => {
  // Setup una vez antes de todos los tests: crear datos de prueba
  before(() => {
    cy.login();
    // Crear todos los catálogos y un dispositivo
    cy.setupTestData();
  });

  beforeEach(() => {
    cy.login();
    cy.visitCatalogsPage();
  });

  describe("Navegación entre Catálogos", () => {
    it("Muestra el título de la página", () => {
      cy.contains("Gestión de Catálogos").should("be.visible");
      cy.contains("Administra los catálogos del sistema").should("be.visible");
    });

    it("Permite navegar entre los diferentes catálogos usando tabs", () => {
      const catalogs = [
        { id: "areas", name: "Áreas" },
        { id: "departments", name: "Departamentos" },
        { id: "torretas", name: "Torretas" },
        { id: "torreta-colors", name: "Colores de Torreta" },
        { id: "receptors", name: "Receptores" },
        { id: "emails", name: "Correos" },
      ];

      catalogs.forEach((catalog) => {
        cy.get(`[data-cy="catalog-tab-${catalog.id}"]`).click();
        cy.contains(catalog.name).should("be.visible");
      });
    });
  });

  describe("Catálogo de Áreas", () => {
    beforeEach(() => {
      cy.get('[data-cy="catalog-tab-areas"]').click();
      // Esperar a que el catálogo de áreas esté activo y cargado
      cy.get('[data-cy="areas-table"]', { timeout: 20000 }).should("exist");
      // Esperar a que termine la carga
      cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
      // Esperar a que haya al menos una fila con datos
      cy.get('[data-cy="areas-table"]').within(() => {
        cy.get('[data-cy="table-row"]', { timeout: 20000 }).should(
          "have.length.at.least",
          1
        );
      });
    });

    it("Muestra la tabla de áreas con datos", () => {
      // Esperar a que aparezca la tabla
      cy.get('[data-cy="areas-table"]', { timeout: 20000 })
        .should("exist")
        .and("be.visible");
      cy.get('[data-cy="areas-table"]').within(() => {
        cy.get('[data-cy="table-row"]').should("have.length.at.least", 1);
      });
    });

    it("Crea un nuevo área", () => {
      const areaName = `Área Test ${Date.now()}`;

      cy.get('[data-cy="create-area-button"]').click();
      cy.get('[data-cy="create-area-modal"]').should("be.visible");

      // Llenar el formulario
      cy.get('input[name="name"]').clear().type(areaName);

      // Enviar el formulario
      cy.get('[data-cy="create-area-modal"]').within(() => {
        cy.get('button[type="submit"]').click();
      });

      // Esperar a que el modal se cierre
      cy.get('[data-cy="create-area-modal"]').should("not.exist");

      // Verificar que el área aparece en la tabla
      cy.get('[data-cy="areas-table"]').within(() => {
        cy.contains(areaName).should("be.visible");
      });
    });

    it("Edita un área existente", () => {
      const newName = `Área Editada ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="areas-table"]').within(() => {
        cy.get('[data-cy="edit-row-button"]').first().click();
      });

      cy.get('[data-cy="edit-area-modal"]').should("be.visible");

      // Obtener el nombre original
      cy.get('input[name="name"]').then(($input) => {
        const originalName = $input.val() as string;

        // Cambiar el nombre
        cy.get('input[name="name"]').clear().type(newName);

        // Guardar cambios
        cy.get('[data-cy="edit-area-modal"]').within(() => {
          cy.get('button[type="submit"]').click();
        });

        // Esperar a que el modal se cierre
        cy.get('[data-cy="edit-area-modal"]').should("not.exist");

        // Verificar que el nombre cambió en la tabla
        cy.get('[data-cy="areas-table"]').within(() => {
          cy.contains(newName).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });

    it("Elimina un área existente", () => {
      // Obtener el nombre del primer área antes de eliminarla
      let nameToDelete: string;
      cy.get('[data-cy="areas-table"]').within(() => {
        cy.get('[data-cy="table-row"]')
          .first()
          .within(() => {
            cy.get("td")
              .eq(1)
              .invoke("text")
              .then((areaName) => {
                nameToDelete = areaName.trim();
              });
          });
      });

      // Hacer click en eliminar (fuera del contexto de la tabla)
      cy.get('[data-cy="areas-table"]').within(() => {
        cy.get('[data-cy="delete-row-button"]').first().click();
      });

      // Esperar y confirmar eliminación en el modal (fuera del contexto de la tabla)
      cy.get('[data-cy="delete-area-confirmation-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Hacer click en el botón de confirmar usando el data-cy específico
      cy.get('[data-cy="confirmation-confirm-button"]')
        .should("be.visible")
        .should("not.be.disabled")
        .click();

      // Esperar a que el modal se cierre después de la eliminación
      // El modal se cierra cuando setIsDeleteModalOpen(false) se ejecuta
      cy.get('[data-cy="delete-area-confirmation-modal"]', {
        timeout: 15000,
      }).should("not.exist");

      // Esperar un momento para que la tabla se actualice
      cy.wait(500);

      // Verificar que el área ya no aparece en la tabla
      cy.get('[data-cy="areas-table"]', { timeout: 10000 }).within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Catálogo de Departamentos", () => {
    beforeEach(() => {
      cy.get('[data-cy="catalog-tab-departments"]').click();
      // Esperar a que el catálogo de departamentos esté activo y cargado
      cy.get('[data-cy="departments-table"]', { timeout: 20000 }).should(
        "exist"
      );
      // Esperar a que termine la carga
      cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
      // Esperar a que haya al menos una fila con datos
      cy.get('[data-cy="departments-table"]').within(() => {
        cy.get('[data-cy="table-row"]', { timeout: 20000 }).should(
          "have.length.at.least",
          1
        );
      });
    });

    it("Muestra la tabla de departamentos con datos", () => {
      cy.get('[data-cy="departments-table"]', { timeout: 20000 })
        .should("exist")
        .and("be.visible");
      cy.get('[data-cy="departments-table"]').within(() => {
        cy.get('[data-cy="table-row"]').should("have.length.at.least", 1);
      });
    });

    it("Crea un nuevo departamento", () => {
      const deptName = `Depto Test ${Date.now()}`;
      const deptColor = "#FF5733";

      cy.get('[data-cy="create-department-button"]').click();
      cy.get('[data-cy="create-department-modal"]').should("be.visible");

      // Llenar el formulario
      cy.get('input[name="name"]').clear().type(deptName);
      cy.get('input[type="color"]').invoke("val", deptColor).trigger("change");

      // Enviar el formulario
      cy.get('[data-cy="create-department-modal"]').within(() => {
        cy.get('button[type="submit"]').click();
      });

      // Esperar a que el modal se cierre
      cy.get('[data-cy="create-department-modal"]').should("not.exist");

      // Verificar que el departamento aparece en la tabla
      cy.get('[data-cy="departments-table"]').within(() => {
        cy.contains(deptName).should("be.visible");
      });
    });

    it("Edita un departamento existente", () => {
      const newName = `Depto Editado ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="departments-table"]').within(() => {
        cy.get('[data-cy="edit-row-button"]').first().click();
      });

      cy.get('[data-cy="edit-department-modal"]').should("be.visible");

      // Obtener el nombre original
      cy.get('input[name="name"]').then(($input) => {
        const originalName = $input.val() as string;

        // Cambiar el nombre
        cy.get('input[name="name"]').clear().type(newName);

        // Guardar cambios
        cy.get('[data-cy="edit-department-modal"]').within(() => {
          cy.get('button[type="submit"]').click();
        });

        // Esperar a que el modal se cierre
        cy.get('[data-cy="edit-department-modal"]').should("not.exist");

        // Verificar que el nombre cambió en la tabla
        cy.get('[data-cy="departments-table"]').within(() => {
          cy.contains(newName).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });

    it("Elimina un departamento existente", () => {
      // Obtener el nombre del primer departamento antes de eliminarlo
      let nameToDelete: string;
      cy.get('[data-cy="departments-table"]').within(() => {
        cy.get('[data-cy="table-row"]')
          .first()
          .within(() => {
            cy.get("td")
              .eq(1)
              .invoke("text")
              .then((deptName) => {
                nameToDelete = deptName.trim();
              });
          });
      });

      // Hacer click en eliminar
      cy.get('[data-cy="departments-table"]').within(() => {
        cy.get('[data-cy="delete-row-button"]').first().click();
      });

      // Esperar y confirmar eliminación en el modal
      cy.get('[data-cy="delete-department-confirmation-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Hacer click en el botón de confirmar
      cy.get('[data-cy="confirmation-confirm-button"]')
        .should("be.visible")
        .should("not.be.disabled")
        .click();

      // Esperar a que el modal se cierre después de la eliminación
      cy.get('[data-cy="delete-department-confirmation-modal"]', {
        timeout: 15000,
      }).should("not.exist");

      // Esperar un momento para que la tabla se actualice
      cy.wait(500);

      // Verificar que el departamento ya no aparece en la tabla
      cy.get('[data-cy="departments-table"]', { timeout: 10000 }).within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Catálogo de Receptores", () => {
    beforeEach(() => {
      cy.get('[data-cy="catalog-tab-receptors"]').click();
      // Esperar a que el catálogo de receptores esté activo y cargado
      cy.get('[data-cy="receptors-table"]', { timeout: 20000 }).should("exist");
      // Esperar a que termine la carga
      cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
      // Esperar a que haya al menos una fila con datos
      cy.get('[data-cy="receptors-table"]').within(() => {
        cy.get('[data-cy="table-row"]', { timeout: 20000 }).should(
          "have.length.at.least",
          1
        );
      });
    });

    it("Muestra la tabla de receptores con datos", () => {
      cy.get('[data-cy="receptors-table"]', { timeout: 20000 })
        .should("exist")
        .and("be.visible");
      cy.get('[data-cy="receptors-table"]').within(() => {
        cy.get('[data-cy="table-row"]').should("have.length.at.least", 1);
      });
    });

    it("Crea un nuevo receptor", () => {
      const externalId = `REC${Date.now()}`;
      const receptorName = `Receptor Test ${Date.now()}`;

      cy.get('[data-cy="create-receptor-button"]').click();
      cy.get('[data-cy="create-receptor-modal"]').should("be.visible");

      // Llenar el formulario
      cy.get('input[name="externalId"]').clear().type(externalId);
      cy.get('input[name="name"]').clear().type(receptorName);

      // Enviar el formulario
      cy.get('[data-cy="create-receptor-modal"]').within(() => {
        cy.get('button[type="submit"]').click();
      });

      // Esperar a que el modal se cierre
      cy.get('[data-cy="create-receptor-modal"]').should("not.exist");

      // Verificar que el receptor aparece en la tabla
      cy.get('[data-cy="receptors-table"]').within(() => {
        cy.contains(receptorName).should("be.visible");
      });
    });

    it("Edita un receptor existente", () => {
      const newName = `Receptor Editado ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="receptors-table"]').within(() => {
        cy.get('[data-cy="edit-row-button"]').first().click();
      });

      cy.get('[data-cy="edit-receptor-modal"]').should("be.visible");

      // Obtener el nombre original
      cy.get('input[name="name"]').then(($input) => {
        const originalName = $input.val() as string;

        // Cambiar el nombre
        cy.get('input[name="name"]').clear().type(newName);

        // Guardar cambios
        cy.get('[data-cy="edit-receptor-modal"]').within(() => {
          cy.get('button[type="submit"]').click();
        });

        // Esperar a que el modal se cierre
        cy.get('[data-cy="edit-receptor-modal"]').should("not.exist");

        // Verificar que el nombre cambió en la tabla
        cy.get('[data-cy="receptors-table"]').within(() => {
          cy.contains(newName).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });

    it("Elimina un receptor existente", () => {
      // Obtener el nombre del primer receptor antes de eliminarlo
      let nameToDelete: string;
      cy.get('[data-cy="receptors-table"]').within(() => {
        cy.get('[data-cy="table-row"]')
          .first()
          .within(() => {
            cy.get("td")
              .eq(2)
              .invoke("text")
              .then((receptorName) => {
                nameToDelete = receptorName.trim();
              });
          });
      });

      // Hacer click en eliminar
      cy.get('[data-cy="receptors-table"]').within(() => {
        cy.get('[data-cy="delete-row-button"]').first().click();
      });

      // Esperar y confirmar eliminación en el modal
      cy.get('[data-cy="delete-receptor-confirmation-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Hacer click en el botón de confirmar
      cy.get('[data-cy="confirmation-confirm-button"]')
        .should("be.visible")
        .should("not.be.disabled")
        .click();

      // Esperar a que el modal se cierre después de la eliminación
      cy.get('[data-cy="delete-receptor-confirmation-modal"]', {
        timeout: 15000,
      }).should("not.exist");

      // Esperar un momento para que la tabla se actualice
      cy.wait(500);

      // Verificar que el receptor ya no aparece en la tabla
      cy.get('[data-cy="receptors-table"]', { timeout: 10000 }).within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Catálogo de Torretas", () => {
    beforeEach(() => {
      cy.get('[data-cy="catalog-tab-torretas"]').click();
      // Esperar a que el catálogo de torretas esté activo y cargado
      cy.get('[data-cy="torretas-table"]', { timeout: 20000 }).should("exist");
      // Esperar a que termine la carga
      cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
      // Esperar a que haya al menos una fila con datos
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.get('[data-cy="table-row"]', { timeout: 20000 }).should(
          "have.length.at.least",
          1
        );
      });
    });

    it("Muestra la tabla de torretas con datos", () => {
      cy.get('[data-cy="torretas-table"]', { timeout: 20000 })
        .should("exist")
        .and("be.visible");
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.get('[data-cy="table-row"]').should("have.length.at.least", 1);
      });
    });

    it("Crea una nueva torreta", () => {
      const torretaName = `Torreta Test ${Date.now()}`;
      const externalId = `TOR${Date.now()}`;

      cy.get('[data-cy="create-torreta-button"]').click();
      cy.get('[data-cy="create-torreta-modal"]', { timeout: 5000 }).should(
        "be.visible"
      );

      // Llenar el formulario
      cy.get('input[name="name"]').clear().type(torretaName);
      cy.get('input[name="externalId"]')
        .click()
        .type("{selectAll}" + externalId);

      // Verificar que no hay errores de validación antes de enviar
      cy.get('[data-cy="create-torreta-modal"]').within(() => {
        cy.contains("El nombre es requerido").should("not.exist");
      });

      // Enviar el formulario
      cy.get('[data-cy="create-torreta-modal"]').within(() => {
        cy.get('button[type="submit"]').should("not.be.disabled").click();
      });

      // Esperar a que el modal se cierre completamente
      // Si hay un error, el modal permanecerá abierto y el test fallará aquí
      cy.get('[data-cy="create-torreta-modal"]', { timeout: 20000 }).should(
        "not.exist"
      );

      // Esperar a que la tabla se recargue (verificar que no hay spinner)
      cy.get('[data-cy="torretas-table"]', { timeout: 10000 }).should("exist");
      cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");

      // Verificar que la torreta aparece en la tabla
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.contains(torretaName, { timeout: 10000 }).should("be.visible");
      });
    });

    it("Edita una torreta existente", () => {
      const newName = `Torreta Editada ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.get('[data-cy="edit-row-button"]').first().click();
      });

      cy.get('[data-cy="edit-torreta-modal"]', { timeout: 5000 }).should(
        "be.visible"
      );

      // Obtener el nombre original
      cy.get('input[name="name"]').then(($input) => {
        const originalName = $input.val() as string;

        // Cambiar el nombre
        cy.get('input[name="name"]').clear().type(newName);

        // Verificar que no hay errores de validación
        cy.get('[data-cy="edit-torreta-modal"]').within(() => {
          cy.contains("El nombre es requerido").should("not.exist");
        });

        // Guardar cambios
        cy.get('[data-cy="edit-torreta-modal"]').within(() => {
          cy.get('button[type="submit"]').should("not.be.disabled").click();
        });

        // Esperar a que el modal se cierre
        cy.get('[data-cy="edit-torreta-modal"]', { timeout: 20000 }).should(
          "not.exist"
        );

        // Esperar a que la tabla se recargue
        cy.get('[data-cy="torretas-table"]', { timeout: 10000 }).should(
          "exist"
        );
        cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");

        // Verificar que el nombre cambió en la tabla
        cy.get('[data-cy="torretas-table"]').within(() => {
          cy.contains(newName, { timeout: 10000 }).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });

    it("Elimina una torreta existente", () => {
      // Obtener el nombre de la primera torreta antes de eliminarla
      let nameToDelete: string;
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.get('[data-cy="table-row"]')
          .first()
          .within(() => {
            cy.get("td")
              .eq(1)
              .invoke("text")
              .then((torretaName) => {
                nameToDelete = torretaName.trim();
              });
          });
      });

      // Hacer click en eliminar
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.get('[data-cy="delete-row-button"]').first().click();
      });

      // Esperar y confirmar eliminación en el modal
      cy.get('[data-cy="delete-torreta-confirmation-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Hacer click en el botón de confirmar
      cy.get('[data-cy="confirmation-confirm-button"]')
        .should("be.visible")
        .should("not.be.disabled")
        .click();

      // Esperar a que el modal se cierre después de la eliminación
      cy.get('[data-cy="delete-torreta-confirmation-modal"]', {
        timeout: 20000,
      }).should("not.exist");

      // Esperar a que la tabla se recargue
      cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");

      // Verificar que la torreta ya no aparece en la tabla
      cy.get('[data-cy="torretas-table"]', { timeout: 10000 }).should("exist");
      cy.get('[data-cy="torretas-table"]').within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Catálogo de Colores de Torreta", () => {
    beforeEach(() => {
      cy.get('[data-cy="catalog-tab-torreta-colors"]').click();
      // Esperar a que el catálogo de colores de torreta esté activo y cargado
      cy.get('[data-cy="torreta-colors-table"]', { timeout: 20000 }).should(
        "exist"
      );
      // Esperar a que termine la carga
      cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
      // Esperar a que haya al menos una fila con datos
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.get('[data-cy="table-row"]', { timeout: 20000 }).should(
          "have.length.at.least",
          1
        );
      });
    });

    it("Muestra la tabla de colores de torreta con datos", () => {
      cy.get('[data-cy="torreta-colors-table"]', { timeout: 20000 })
        .should("exist")
        .and("be.visible");
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.get('[data-cy="table-row"]').should("have.length.at.least", 1);
      });
    });

    it("Crea un nuevo color de torreta", () => {
      const colorName = `Color Test ${Date.now()}`;
      // deviceColorId debe tener máximo 10 caracteres según validación del backend
      const timestamp = Date.now().toString();
      const deviceColorId = `COL${timestamp.slice(-7)}`; // COL + últimos 7 dígitos = máximo 10 caracteres
      const htmlColor = "#FF5733";

      cy.get('[data-cy="create-torreta-color-button"]').click();
      cy.get('[data-cy="create-torreta-color-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Llenar el formulario
      cy.get('input[name="name"]').clear().type(colorName);
      cy.get('input[type="color"]').invoke("val", htmlColor).trigger("change");
      cy.get('input[placeholder="#000000"]').clear().type(htmlColor);
      cy.get('input[name="deviceColorId"]').clear().type(deviceColorId);

      // Verificar que no hay errores de validación antes de enviar
      cy.get('[data-cy="create-torreta-color-modal"]').within(() => {
        cy.contains("El nombre es requerido").should("not.exist");
        cy.contains("El ID del dispositivo es requerido").should("not.exist");
      });

      // Enviar el formulario
      cy.get('[data-cy="create-torreta-color-modal"]').within(() => {
        cy.get('button[type="submit"]').should("not.be.disabled").click();
      });

      // Esperar a que el modal se cierre (indica que la operación fue exitosa)
      // Si hay un error, el modal permanecerá abierto mostrando el mensaje de error
      cy.get('[data-cy="create-torreta-color-modal"]', {
        timeout: 20000,
      }).should("not.exist");

      // Esperar a que la tabla se recargue
      cy.get('[data-cy="torreta-colors-table"]', { timeout: 10000 }).should(
        "exist"
      );
      cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");

      // Verificar que el color aparece en la tabla
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.contains(colorName, { timeout: 10000 }).should("be.visible");
      });
    });

    it("Edita un color de torreta existente", () => {
      const newName = `Color Editado ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.get('[data-cy="edit-row-button"]').first().click();
      });

      cy.get('[data-cy="edit-torreta-color-modal"]', { timeout: 5000 }).should(
        "be.visible"
      );

      // Obtener el nombre original
      cy.get('input[name="name"]').then(($input) => {
        const originalName = $input.val() as string;

        // Cambiar el nombre
        cy.get('input[name="name"]').clear().type(newName);

        // Verificar que no hay errores de validación
        cy.get('[data-cy="edit-torreta-color-modal"]').within(() => {
          cy.contains("El nombre es requerido").should("not.exist");
        });

        // Guardar cambios
        cy.get('[data-cy="edit-torreta-color-modal"]').within(() => {
          cy.get('button[type="submit"]').should("not.be.disabled").click();
        });

        // Esperar a que el modal se cierre
        cy.get('[data-cy="edit-torreta-color-modal"]', {
          timeout: 20000,
        }).should("not.exist");

        // Esperar a que la tabla se recargue
        cy.get('[data-cy="torreta-colors-table"]', { timeout: 10000 }).should(
          "exist"
        );
        cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");

        // Verificar que el nombre cambió en la tabla
        cy.get('[data-cy="torreta-colors-table"]').within(() => {
          cy.contains(newName, { timeout: 10000 }).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });

    it("Elimina un color de torreta existente", () => {
      // Obtener el nombre del primer color antes de eliminarlo
      let nameToDelete: string;
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.get('[data-cy="table-row"]')
          .first()
          .within(() => {
            cy.get("td")
              .eq(1)
              .invoke("text")
              .then((colorName) => {
                nameToDelete = colorName.trim();
              });
          });
      });

      // Hacer click en eliminar
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.get('[data-cy="delete-row-button"]').first().click();
      });

      // Esperar y confirmar eliminación en el modal
      cy.get('[data-cy="delete-torreta-color-confirmation-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Hacer click en el botón de confirmar
      cy.get('[data-cy="confirmation-confirm-button"]')
        .should("be.visible")
        .should("not.be.disabled")
        .click();

      // Esperar a que el modal se cierre después de la eliminación
      cy.get('[data-cy="delete-torreta-color-confirmation-modal"]', {
        timeout: 20000,
      }).should("not.exist");

      // Esperar a que la tabla se recargue
      cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");

      // Verificar que el color ya no aparece en la tabla
      cy.get('[data-cy="torreta-colors-table"]', { timeout: 10000 }).should(
        "exist"
      );
      cy.get('[data-cy="torreta-colors-table"]').within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Catálogo de Emails", () => {
    beforeEach(() => {
      cy.get('[data-cy="catalog-tab-emails"]').click();
      // Esperar a que el catálogo de emails esté activo y cargado
      cy.get('[data-cy="emails-table"]', { timeout: 20000 }).should("exist");
      // Esperar a que termine la carga
      cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
      // Esperar a que haya al menos una fila con datos
      cy.get('[data-cy="emails-table"]').within(() => {
        cy.get('[data-cy="table-row"]', { timeout: 20000 }).should(
          "have.length.at.least",
          1
        );
      });
    });

    it("Muestra la tabla de emails con datos", () => {
      cy.get('[data-cy="emails-table"]', { timeout: 20000 })
        .should("exist")
        .and("be.visible");
      cy.get('[data-cy="emails-table"]').within(() => {
        cy.get('[data-cy="table-row"]').should("have.length.at.least", 1);
      });
    });

    it("Crea un nuevo email", () => {
      const emailName = `Email Test ${Date.now()}`;
      const emailAddress = `test${Date.now()}@example.com`;

      cy.get('[data-cy="create-email-button"]').click();
      cy.get('[data-cy="create-email-modal"]').should("be.visible");

      // Llenar el formulario
      cy.get('input[name="name"]').clear().type(emailName);
      cy.get('input[name="email"]').clear().type(emailAddress);

      // Enviar el formulario
      cy.get('[data-cy="create-email-modal"]').within(() => {
        cy.get('button[type="submit"]').click();
      });

      // Esperar a que el modal se cierre
      cy.get('[data-cy="create-email-modal"]').should("not.exist");

      // Verificar que el email aparece en la tabla
      cy.get('[data-cy="emails-table"]').within(() => {
        cy.contains(emailName).should("be.visible");
      });
    });

    it("Edita un email existente", () => {
      const newName = `Email Editado ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="emails-table"]').within(() => {
        cy.get('[data-cy="edit-row-button"]').first().click();
      });

      cy.get('[data-cy="edit-email-modal"]').should("be.visible");

      // Obtener el nombre original
      cy.get('input[name="name"]').then(($input) => {
        const originalName = $input.val() as string;

        // Cambiar el nombre
        cy.get('input[name="name"]').clear().type(newName);

        // Guardar cambios
        cy.get('[data-cy="edit-email-modal"]').within(() => {
          cy.get('button[type="submit"]').click();
        });

        // Esperar a que el modal se cierre
        cy.get('[data-cy="edit-email-modal"]').should("not.exist");

        // Verificar que el nombre cambió en la tabla
        cy.get('[data-cy="emails-table"]').within(() => {
          cy.contains(newName).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });

    it("Elimina un email existente", () => {
      // Obtener el nombre del primer email antes de eliminarlo
      let nameToDelete: string;
      cy.get('[data-cy="emails-table"]').within(() => {
        cy.get('[data-cy="table-row"]')
          .first()
          .within(() => {
            cy.get("td")
              .eq(1)
              .invoke("text")
              .then((emailName) => {
                nameToDelete = emailName.trim();
              });
          });
      });

      // Hacer click en eliminar
      cy.get('[data-cy="emails-table"]').within(() => {
        cy.get('[data-cy="delete-row-button"]').first().click();
      });

      // Esperar y confirmar eliminación en el modal
      cy.get('[data-cy="delete-email-confirmation-modal"]', {
        timeout: 5000,
      }).should("be.visible");

      // Hacer click en el botón de confirmar
      cy.get('[data-cy="confirmation-confirm-button"]')
        .should("be.visible")
        .should("not.be.disabled")
        .click();

      // Esperar a que el modal se cierre después de la eliminación
      cy.get('[data-cy="delete-email-confirmation-modal"]', {
        timeout: 15000,
      }).should("not.exist");

      // Esperar un momento para que la tabla se actualice
      cy.wait(500);

      // Verificar que el email ya no aparece en la tabla
      cy.get('[data-cy="emails-table"]', { timeout: 10000 }).within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Búsqueda en Catálogos", () => {
    it("Permite buscar en cada catálogo", () => {
      const catalogs = ["areas", "departments", "receptors", "torretas"];

      catalogs.forEach((catalogId) => {
        cy.get(`[data-cy="catalog-tab-${catalogId}"]`).click();
        // Esperar a que la tabla cargue
        cy.get(".animate-spin", { timeout: 10000 }).should("not.exist");
        // Buscar el input de búsqueda (cada catálogo tiene uno)
        cy.get('input[placeholder*="Buscar"]').should("be.visible");
        cy.get('input[placeholder*="Buscar"]').type("Test");
        cy.wait(500); // Esperar a que se actualice la búsqueda
      });
    });
  });
});
